package com.example.service.responses;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private String message;
    private T data;
}
