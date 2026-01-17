namespace MeetingBackend.DTOs;

public class LocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Address { get; set; } = string.Empty;
}

public class CreateMeetingRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DateTime { get; set; }
    public LocationDto Location { get; set; } = null!;
}

public class MeetingResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DateTime { get; set; }
    public LocationDto Location { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
