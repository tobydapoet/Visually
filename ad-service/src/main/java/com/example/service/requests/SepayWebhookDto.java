package com.example.service.requests;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SepayWebhookDto {
    private int id;
    private String gateway;
    private String transactionDate;
    private String accountNumber;
    private BigDecimal transferAmount;
    private String code;
    private String content;
    private String referenceCode;
    private String transferType;
}