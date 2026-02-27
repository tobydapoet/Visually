package com.example.service.responses;

import com.example.service.enums.StatusType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserStatusUpdateEvent {
    private UUID id;

    private StatusType status;
}
