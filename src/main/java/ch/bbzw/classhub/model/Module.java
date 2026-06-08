package ch.bbzw.classhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "module")
public class Module extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "class_id", nullable = false)
    public Long classId;

    @Column(nullable = false)
    public String name;

    @Column(name = "created_at")
    public LocalDateTime createdAt = LocalDateTime.now();

    public static List<Module> findByClassId(Long classId) {
        return list("classId", classId);
    }
}
