export abstract class Entity<TProps extends Record<string, unknown>> {
  protected constructor(
    protected readonly props: TProps,
    public readonly id: string,
  ) {}

  public equals(entity?: Entity<TProps> | null): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this.id === entity.id;
  }

  public toJSON(): Record<string, unknown> {
    return { id: this.id, ...this.props };
  }
}

