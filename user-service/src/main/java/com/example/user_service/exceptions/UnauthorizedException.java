package com.example.user_service.exceptions;

public class UnauthorizedException extends BusinessException{
    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED");
    }
}
