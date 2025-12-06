type GetManyPropsType = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "id" | "price" | "name" | "created_at";
  order?: "asc" | "desc";
  status?: "active" | "inactive" | "archived";
};

export type { GetManyPropsType };
