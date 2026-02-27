package com.example.service.entities;

import com.example.service.enums.GenderOption;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "adTarget")
public class AdTarget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer ageMin;

    @Column()
    private Integer ageMax;

    @Column(nullable = false)
    private GenderOption gender;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "adTarget")
    private List<Ad> adList = new ArrayList<>();
}
