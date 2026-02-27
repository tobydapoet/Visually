package com.example.follow_service.exceptions;

public class SystemException extends RuntimeException {

    public SystemException(String message, Throwable cause) {
        super(message, cause);
    }
}