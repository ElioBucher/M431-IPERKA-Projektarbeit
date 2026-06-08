package ch.bbzw.classhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "homework")
public class Homework extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "module_id", nullable = false)
    public Long moduleId;

    @Column(nullable = false)
    public String title;

    public String description;

    @Column(name = "due_date", nullable = false)
    public String dueDate;

    @Column(name = "created_at")
    public LocalDateTime createdAt = LocalDateTime.now();

    public static List<Homework> findByModuleId(Long moduleId) {
        return list("moduleId = ?1 ORDER BY dueDate DESC", moduleId);
    }
}
