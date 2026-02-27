package com.example.media_service.exceptions;

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String message) {
        super(message, "FORBIDDEN");
    }
}