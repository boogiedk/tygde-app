using Microsoft.EntityFrameworkCore;
using MeetingBackend.Models;

namespace MeetingBackend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Meeting> Meetings { get; set; } = null!;
    public DbSet<Participant> Participants { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DateTime).IsRequired();
            entity.Property(e => e.Latitude).IsRequired();
            entity.Property(e => e.Longitude).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.PinHash).IsRequired().HasMaxLength(64);
        });

        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(7);
            entity.Property(e => e.JoinedAt).IsRequired();
            entity.Property(e => e.IsActive).IsRequired();

            entity.HasOne(e => e.Meeting)
                .WithMany(m => m.Participants)
                .HasForeignKey(e => e.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
