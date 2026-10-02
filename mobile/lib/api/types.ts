export type Profile = {
  name: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  businessName: string | null;
};

export type Account = {
  id: string;
  email: string;
  profileCompleted: boolean;
  profile: Profile | null;
  selectedTaskCount: number;
};

export type Session = {
  token: string;
  user: Account;
};

export type Task = {
  id: string;
  name: string;
  description: string;
};

export type TaskCategory = {
  id: string;
  name: string;
  tasks: Task[];
};

export type SelectedTask = Task & {
  categoryId: string;
  categoryName: string;
};

export type CodeDelivery = {
  resendAvailableInSeconds: number;
};
