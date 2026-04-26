package com.example.media_service.enums;

public enum FileType {
    IMAGE("image"),
    VIDEO("video"),
    AUDIO("video");

    private final String fileType;

    FileType(String fileType) {
        this.fileType = fileType;
    }

    public String fileType() {
        return fileType;
    }
}

