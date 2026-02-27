package com.example.media_service.enums;

public enum FileType {
    IMAGE("image"),
    VIDEO("video"),
    AUDIO("video");

    private final String cloudinaryType;

    FileType(String cloudinaryType) {
        this.cloudinaryType = cloudinaryType;
    }

    public String cloudinary() {
        return cloudinaryType;
    }
}

