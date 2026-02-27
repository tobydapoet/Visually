package com.example.user_service.exceptions;

public class ValidatorException extends BusinessException {
    public ValidatorException(String message) {
        super(message,"VALIDATION_ERROR");
    }
}
