package com.example.follow_service.exceptions;

public class ConflictException extends BusinessException {
    public ConflictException(String message) {
        super(message,"CONFLICT");
    }
}
