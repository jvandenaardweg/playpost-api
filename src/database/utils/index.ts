// From: https://github.com/typeorm/typeorm/issues/873#issuecomment-424643086
// Transforms a string to a number
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}
