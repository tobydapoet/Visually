package com.example.media_service.exceptions;

public class UnauthorizedException extends BusinessException{
    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED");
    }
}
