package com.example.user_service.exceptions;

public class ConflictException extends BusinessException {
    public ConflictException(String message) {
        super(message,"CONFLICT");
    }
}
