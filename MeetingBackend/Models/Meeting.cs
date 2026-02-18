using System.ComponentModel.DataAnnotations;

namespace MeetingBackend.Models;

public class Meeting
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    public DateTime DateTime { get; set; }
    
    [Required]
    public double Latitude { get; set; }
    
    [Required]
    public double Longitude { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }

    [Required]
    [MaxLength(64)]
    public string PinHash { get; set; } = string.Empty;

    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}
