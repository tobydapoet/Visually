package com.example.media_service.services;

import com.example.media_service.enums.FileType;
import com.example.media_service.exceptions.ConflictException;
import com.example.media_service.exceptions.SystemException;
import com.example.media_service.responses.UploadResult;
import com.thoughtworks.xstream.core.BaseException;
import org.springframework.beans.factory.annotation.Value;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.apache.tika.Tika;
import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.mp4parser.IsoFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@Service
public class UploadService {
    @Autowired
    private Storage storage;

    @Value("${gcs.bucket-name}")
    private String bucketName;

    public FileType detectFileType(MultipartFile file) {
        try {
            Tika tika = new Tika();
            String mimeType = tika.detect(file.getInputStream());

            if (mimeType == null || mimeType.isBlank()) {
                throw new ConflictException("Cannot detect mime type");
            }

            if (mimeType.startsWith("image/")) {
                return FileType.IMAGE;
            }

            if (mimeType.startsWith("video/")) {
                return FileType.VIDEO;
            }

            if (mimeType.startsWith("audio/")) {
                return FileType.AUDIO;
            }

            throw new ConflictException("Unsupported file type: " + mimeType);

        } catch (SystemException e) {
            throw e;
        } catch (Exception e) {
            throw new SystemException("Cannot detect file type", e);
        }
    }

    private Double getDuration(MultipartFile file, FileType type) {
        File tempFile = null;
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".tmp";

            tempFile = File.createTempFile("duration-", extension);
            Files.write(tempFile.toPath(), file.getBytes());

            if (type == FileType.VIDEO) {
                IsoFile isoFile = new IsoFile(tempFile.getAbsolutePath());
                double duration = (double) isoFile.getMovieBox().getMovieHeaderBox().getDuration()
                        / isoFile.getMovieBox().getMovieHeaderBox().getTimescale();
                isoFile.close();
                return duration;
            }

            if (type == FileType.AUDIO) {
                AudioFile audioFile = AudioFileIO.read(tempFile);
                return (double) audioFile.getAudioHeader().getTrackLength();
            }

            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (tempFile != null) tempFile.delete();
        }
    }

    public UploadResult upload(MultipartFile file, String folder) {
        try {
            FileType type = detectFileType(file);

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = folder + "/" + System.currentTimeMillis() + extension;

            BlobId blobId = BlobId.of(bucketName, fileName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(file.getContentType())
                    .build();

            storage.create(blobInfo, file.getBytes());

            String url = String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);

            Double duration = null;
            if (type == FileType.VIDEO || type == FileType.AUDIO) {
                duration = getDuration(file, type);
            }

            return new UploadResult(url, type, duration);

        } catch (ConflictException e) {
            throw e;
        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            throw new SystemException("Upload failed: " + e.getMessage(), e);
        }
    }

    public void deleteMany(List<String> urls) {
        urls.forEach(url -> {
            String fileName = url.replace(
                    String.format("https://storage.googleapis.com/%s/", bucketName), ""
            );
            storage.delete(BlobId.of(bucketName, fileName));
        });
    }
}
