import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Material = {
    name : Text;
    owner : Principal;
    content : Text;
  };

  let materials = Map.empty<Text, Material>();

  public shared ({ caller }) func uploadMaterial(name : Text, content : Text) : async () {
    if (materials.containsKey(name)) {
      Runtime.trap("Material with the name " # name # " already exists. Please use a different name or delete the existing file before trying again.");
    };
    let material : Material = {
      name;
      owner = caller;
      content;
    };
    materials.add(name, material);
  };

  public query func getMaterial(name : Text) : async Material {
    switch (materials.get(name)) {
      case (null) { Runtime.trap("Material does not exist") };
      case (?material) { material };
    };
  };

  public shared ({ caller }) func deleteMaterial(name : Text) : async () {
    switch (materials.get(name)) {
      case (null) {
        Runtime.trap("Material does not exist. No file with the name: " # name # " was found.");
      };
      case (?material) {
        if (material.owner != caller) {
          Runtime.trap("Unauthorized: Only the owner can delete this material.");
        };
        materials.remove(name);
      };
    };
  };

  public query func listMaterials() : async [Material] {
    materials.values().toArray();
  };

  public query func getOwner(name : Text) : async Principal {
    switch (materials.get(name)) {
      case (null) { Runtime.trap("Material does not exist") };
      case (?material) { material.owner };
    };
  };

  public query func countMaterialsByUser(user : Principal) : async Nat {
    var count = 0;
    for (material in materials.values()) {
      if (material.owner == user) { count += 1 };
    };
    count;
  };

  public query func getContent(name : Text) : async Text {
    switch (materials.get(name)) {
      case (null) { Runtime.trap("Material does not exist") };
      case (?material) { material.content };
    };
  };

  public shared ({ caller }) func updateContent(name : Text, newContent : Text) : async () {
    switch (materials.get(name)) {
      case (null) { Runtime.trap("Material does not exist") };
      case (?material) {
        if (material.owner != caller) {
          Runtime.trap("Unauthorized: Only the owner can update this material.");
        };
        materials.add(name, { material with content = newContent });
      };
    };
  };

  public query func getMaterialsByOwner(owner : Principal) : async [Material] {
    materials.values().filter(func(m) { m.owner == owner }).toArray();
  };
};
