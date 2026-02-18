using System.ComponentModel.DataAnnotations;

namespace MeetingBackend.Models;

public class Participant
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid MeetingId { get; set; }

    [Required]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [MaxLength(7)]
    public string Color { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public DateTime JoinedAt { get; set; }

    public DateTime? LastSeenAt { get; set; }

    public bool IsActive { get; set; } = true;

    public Meeting Meeting { get; set; } = null!;
}
