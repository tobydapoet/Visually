package com.example.media_service.exceptions;

public class NotFoundException extends BusinessException {
    public NotFoundException(String message) {
        super(message, "NOT_FOUND");
    }
}
