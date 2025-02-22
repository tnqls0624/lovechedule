import { Photo } from "../schema/photo.schema";

export interface PhotoRepository {
  insert(body: { url:string, hash: string }): Promise<Photo>;
  // findAll(): Promise<User[]>;
  // findByAlbumId(
  //   _id: string,
  //   year: string,
  //   month: string,
  //   day: string,
  // ): Promise<Photo[]>;
  // update(_id: string, body: UpdateScheduleRequestDto): Promise<Photo>;
  // delete(_id: string): Promise<Photo>;
  // findByUserId(user_id: string): Promise<User>;
  findHash(hash:string):Promise<Photo>;
  // join(workspace_id: Types.ObjectId, user_id: Types.ObjectId): Promise<User>;
}
