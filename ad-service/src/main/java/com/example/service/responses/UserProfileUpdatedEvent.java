package com.example.service.responses;


import com.example.service.enums.Gender;
import com.example.service.enums.GenderOption;
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
