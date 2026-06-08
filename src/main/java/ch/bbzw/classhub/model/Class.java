package ch.bbzw.classhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "class")
public class Class extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "class_name", unique = true, nullable = false)
    public String className;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    @Column(name = "created_at")
    public LocalDateTime createdAt = LocalDateTime.now();

    public static Class findByClassName(String className) {
        return find("className", className).firstResult();
    }
}
