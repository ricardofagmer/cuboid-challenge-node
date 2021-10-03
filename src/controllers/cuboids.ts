import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import { Id } from 'objection';
import { Bag, Cuboid } from '../models';

export const list = async (req: Request, res: Response): Promise<Response> => {
  const ids = req.query.ids as Id[];
  const cuboids = await Cuboid.query().findByIds(ids).withGraphFetched('bag');

  return res.status(200).json(cuboids);
};

export const get = async (req: Request, res: Response): Promise<Response> => {
  const cuboid = await Cuboid.query().findById(req.params.id);

  if (cuboid) {
    cuboid.volume = cuboid.width * cuboid.height * cuboid.depth;
    return res.status(HttpStatus.OK).json(cuboid);
  }

  return res.sendStatus(HttpStatus.NOT_FOUND);
};

export const create = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { width, height, depth, bagId } = req.body;

  const bag = await Bag.query().findById(bagId);

  if (!bag) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  const bagCapacity = bag?.volume ?? 0;
  const cuboidVolume = width * height * depth;

  const cuboids = await Cuboid.query().where({ bagId });
  let bagVolume = 0;

  cuboids.forEach((el) => {
    bagVolume += el.width * el.height * el.depth;
  });

  bagVolume += cuboidVolume;

  if (bagVolume > bagCapacity) {
    return res
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ message: 'Insufficient capacity in bag' });
  }

  const cuboid = await Cuboid.query().insert({
    width,
    height,
    depth,
    bagId,
  });

  return res.status(HttpStatus.CREATED).json(cuboid);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { width, height, depth, bagId } = req.body;
  const bag = await Bag.query().findById(bagId);

  const bagVolume = bag?.volume ?? 0;

  const cuboids = await Cuboid.query()
    .where({ bagId })
    .whereNotIn('id', [+id]);

  let newVolume = 0;

  cuboids.forEach((c) => {
    newVolume += c.width * c.height * c.depth;
  });

  newVolume += width * height * depth;

  if (newVolume > bagVolume) {
    return res
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ id, width: 0, height: 0, depth: 0, bag: { id: bagId }, bagId });
  }

  await Cuboid.query().update({ width, height, depth, bagId }).where({ id });

  return res
    .status(HttpStatus.OK)
    .json({ id, width, height, depth, bag: { id: bagId }, bagId });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const cuboid = await Cuboid.query().findById(id);
  if (!cuboid) {
    return res.status(HttpStatus.NOT_FOUND).send();
  }

  await Cuboid.query().delete().where({ id });

  return res.status(HttpStatus.NO_CONTENT).send();
};
