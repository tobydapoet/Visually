package com.example.service.exceptions;

public class UnauthorizedException extends BusinessException{
    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED");
    }
}
