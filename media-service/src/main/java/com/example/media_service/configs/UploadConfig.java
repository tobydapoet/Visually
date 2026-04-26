package com.example.media_service.configs;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

@Configuration
public class UploadConfig {
    @Value("${gcs.project-id}")
    private String projectId;

    @Value("${gcs.client-email}")
    private String clientEmail;

    @Value("${gcs.private-key}")
    private String privateKey;

    @Bean
    public Storage gcsStorage() throws Exception {
        GoogleCredentials credentials = ServiceAccountCredentials.newBuilder()
                .setProjectId(projectId)
                .setClientEmail(clientEmail)
                .setPrivateKey(loadPrivateKey(privateKey))
                .build();

        return StorageOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build()
                .getService();
    }

    private PrivateKey loadPrivateKey(String key) throws Exception {
        String privateKeyPEM = key
                .replace("\\n", "\n")           // fix escaped newline
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("[\\r\\n\\s]", ""); // xóa tất cả whitespace

        byte[] decoded = Base64.getDecoder().decode(privateKeyPEM);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);
    }
}
