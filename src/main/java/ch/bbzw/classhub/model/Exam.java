package ch.bbzw.classhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "exam")
public class Exam extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "module_id", nullable = false)
    public Long moduleId;

    @Column(nullable = false)
    public String title;

    @Column(name = "exam_date", nullable = false)
    public String examDate;

    public String topics;

    @Column(name = "created_at")
    public LocalDateTime createdAt = LocalDateTime.now();

    public static List<Exam> findByModuleId(Long moduleId) {
        return list("moduleId", moduleId);
    }
}
