import { Id, RelationMappings } from 'objection';
import { Cuboid } from './Cuboid';
import Base from './Base';

export class Bag extends Base {
  id!: Id;
  volume!: number;
  title!: string;
  payloadVolume!: number;
  availableVolume!: number;
  cuboids?: Cuboid[] | undefined;

  static tableName = 'bags';

  static get relationMappings(): RelationMappings {
    return {
      cuboids: {
        relation: Base.HasManyRelation,
        modelClass: 'Cuboid',
        join: {
          from: 'bags.id',
          to: 'cuboids.bagId',
        },
      },
    };
  }

  $afterFind(): void {
    this.setPayloadVolume();
    this.setAvailableVolume();
  }

  private setPayloadVolume() {
    this.payloadVolume = 0;

    if (this.cuboids?.length) {
      this.cuboids.forEach((el) => {
        this.payloadVolume += el.width * el.height * el.depth;
      });
    }
  }

  private setAvailableVolume() {
    this.availableVolume = 0;

    if (this.cuboids?.length) {
      let usedVolume = 0;

      this.cuboids.forEach((c) => {
        usedVolume += c.width * c.height * c.depth;
      });

      this.availableVolume = this.volume - usedVolume;
    } else {
      this.availableVolume = this.volume;
    }
  }
}

export default Bag;
