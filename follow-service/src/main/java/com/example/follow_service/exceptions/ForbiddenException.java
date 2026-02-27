package com.example.follow_service.exceptions;

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String message) {
        super(message, "FORBIDDEN");
    }
}