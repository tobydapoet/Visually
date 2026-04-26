package com.example.service.exceptions;

public class ValidatorException extends BusinessException {
    public ValidatorException(String message) {
        super(message,"VALIDATION_ERROR");
    }
}
