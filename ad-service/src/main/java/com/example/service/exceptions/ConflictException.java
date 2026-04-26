package com.example.service.exceptions;

public class ConflictException extends BusinessException {
    public ConflictException(String message) {
        super(message,"CONFLICT");
    }
}
