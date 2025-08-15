export interface Standing {
  position: number,
  driverName: string,
  team: string,
  points: number,
  teamColor: string,
  driverNumber: number,
  logoPath?: string,
  driverImagePath?: string
}

export interface DriverBase {
  driverId: string;
  driverNumber: number;
  driverName: string;
  teamId: string;
  nationality: string;
  birthDate: string;
  assets: {
    image: string;
    teamLogo: string;
    teamColor?: string;
  };
  updatedAt: number;
}

export interface GPStats {
  races: number;
  wins: number;
  poles: number;
  laps: number;
  dnf: number;
  top10s: number;
  podiums: number;
}

export interface SprintStats {
  races: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  top10s: number;
}

export interface DriverCareer {
  gp: GPStats;
  sprint: SprintStats;
  source: string;
  updatedAt: number;
}

export interface DriverSeason {
  year: number;
  team: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  sprint: {
    points: number;
    wins: number;
    podiums: number;
  };
  updatedAt: number;
}

export interface Driver {
  base: DriverBase;
  career: DriverCareer;
  season: DriverSeason;
}
