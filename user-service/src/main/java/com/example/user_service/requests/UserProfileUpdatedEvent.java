package com.example.user_service.requests;


import com.example.user_service.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileUpdatedEvent {
    private UUID id;

    private LocalDate dob;

    private Gender gender;
}
