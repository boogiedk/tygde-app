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
    public string Pin { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class CreateMeetingResponse
{
    public MeetingFullResponse Meeting { get; set; } = null!;
    public ParticipantResponse Participant { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
}

public class MeetingPreviewResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public int ParticipantCount { get; set; }
}

public class MeetingFullResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DateTime { get; set; }
    public LocationDto Location { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public List<ParticipantResponse> Participants { get; set; } = new();
}

// Обратная совместимость
public class MeetingResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DateTime { get; set; }
    public LocationDto Location { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
