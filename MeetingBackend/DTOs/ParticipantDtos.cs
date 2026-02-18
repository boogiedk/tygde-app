namespace MeetingBackend.DTOs;

public class JoinMeetingRequest
{
    public string Pin { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class JoinMeetingResponse
{
    public ParticipantResponse Participant { get; set; } = null!;
    public MeetingFullResponse Meeting { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
}

public class VerifyTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public class VerifyTokenResponse
{
    public ParticipantResponse Participant { get; set; } = null!;
    public MeetingFullResponse Meeting { get; set; } = null!;
}

public class UpdateLocationRequest
{
    public string Token { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class LeaveRequest
{
    public string Token { get; set; } = string.Empty;
}

public class ParticipantResponse
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsActive { get; set; }
}
