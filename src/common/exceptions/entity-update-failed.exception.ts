export class UpdateFailedException extends Error {
  constructor(entityName: string, identifier: string | number) {
    super(`Failed to update ${entityName} with ID ${identifier}.`);
    this.name = 'UpdateFailedException';
  }
}
