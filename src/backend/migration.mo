import Map "mo:core/Map";

module {
  // Old types (from previous version using authorization/access-control)
  type UserRole = { #admin; #guest; #user };

  type OldActor = {
    accessControlState : {
      var adminAssigned : Bool;
      userRoles : Map.Map<Principal, UserRole>;
    };
    materials : Map.Map<Text, { content : Text; name : Text; owner : Principal }>;
  };

  type NewActor = {
    materials : Map.Map<Text, { content : Text; name : Text; owner : Principal }>;
  };

  public func run(old : OldActor) : NewActor {
    // Discard accessControlState intentionally; retain materials unchanged
    { materials = old.materials };
  };
};
