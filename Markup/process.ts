import {Generator} from './_process/Generator';
import { IStructureCreator } from './_process/IStructureCreator';
import { IGenerator } from './_process/IGenerator';


export function start(structure: IStructureCreator):IGenerator {
    let gen = new Generator();
    gen.setImplementation(structure);
    return gen;
}