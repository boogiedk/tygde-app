using System.ComponentModel.DataAnnotations;

namespace MeetingBackend.Models;

/// <summary>
/// Represents a meeting with location, schedule, and participant information.
/// </summary>
public class Meeting
{
    /// <summary>
    /// Gets or sets the unique identifier of the meeting.
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Gets or sets the title of the meeting. Maximum length is 200 characters.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets an optional description of the meeting. Maximum length is 1000 characters.
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Gets or sets the date and time when the meeting is scheduled.
    /// </summary>
    [Required]
    public DateTime DateTime { get; set; }
    
    /// <summary>
    /// Gets or sets the geographic latitude of the meeting location.
    /// </summary>
    [Required]
    public double Latitude { get; set; }
    
    /// <summary>
    /// Gets or sets the geographic longitude of the meeting location.
    /// </summary>
    [Required]
    public double Longitude { get; set; }
    
    /// <summary>
    /// Gets or sets the human-readable address of the meeting location. Maximum length is 500 characters.
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    
    /// <summary>
    /// Gets or sets the date and time when the meeting was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the hashed PIN used to protect access to the meeting. Maximum length is 64 characters.
    /// </summary>
    [Required]
    [MaxLength(64)]
    public string PinHash { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the collection of participants who have joined the meeting.
    /// </summary>
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}
