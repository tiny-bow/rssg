{
  description = "A flake for rssg";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      rssg = pkgs.buildNpmPackage {
        pname = "rssg";
        version = "1.0.0";

        src = pkgs.lib.cleanSource ./.;

        npmDepsHash = "sha256-qWNuSzGtSx3QUYexyQ+saBGHSH4+h0Qkuvtrd9QySMs=";

        nodejs = pkgs.nodejs_22;

        nativeBuildInputs = [ pkgs.makeWrapper ];

        postInstall = ''
          makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/rssg \
            --set NODE_PATH "$out/lib/node_modules" \
            --add-flags "$out/lib/node_modules/rssg/rssg/.rssg-cache/cli.js"
        '';

        meta = with pkgs.lib; {
          description = "the quartz4 static site generator adapted for ribbon ecosystem";
          homepage = "https://github.com/tiny-bow/rssg";
          license = licenses.mit;
          mainProgram = "rssg";
        };
      };
    in
    {
      version = "1.0.0";

      packages.${system}.default = rssg;

      apps.${system} = {
        default = {
          type = "app";
          program = "${rssg}/bin/rssg";
        };

        rssg = self.apps.${system}.default;
      };

      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_22
          rssg
        ];
      };
    };
}