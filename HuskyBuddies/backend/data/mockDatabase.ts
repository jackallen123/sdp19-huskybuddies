// mock Database File

// user related types and data
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const mockUsers: User[] = [
  {
    id: "1",
    firstName: "Admin",
    lastName: "User",
    email: "admin@uconn.edu",
    password: "admin",
  },
];

// mock data for login and signup screens
export const mockLoginData = {
  email: "admin@uconn.edu",
  password: "admin",
};
