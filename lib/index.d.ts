export interface IParserDelta {
  updates: {
    source: string;
    timestamp: string;
    values: {
      path: string;
      value: any;
    }[];
  }[];
}

export interface IParserDeltaWithSource {
  updates: {
    source: {
      sentence: string;
      talker: string;
      type: string;
    };
    timestamp: string;
    values: {
      path: string;
      value: any;
    }[];
  }[];
}

export interface IParserArgs {
  id: string;
  sentence: string;
  parts: string[];
  tags: {
    source: string;
    timestamp: string;
  };
}
export interface IParserSession {
  [key: string]: any;
}

export interface IPropertyValue {
  value: {
    sentence: string;
    parser: (args: IParserArgs, session: IParserSession) => null | IParserDelta;
  };
}

export type IParserOptionsOnPropertyValuesCallback = (
  val: undefined | IPropertyValue[],
) => void;

export interface IParserOptions {
  onPropertyValues?: (
    propertyName: string,
    onPropertyValuesCallback: IParserOptionsOnPropertyValuesCallback,
  ) => void;
  validateChecksum?: boolean;
}

declare class Parser {
  constructor(opts?: IParserOptions);
  parse<T = (IParserDeltaWithSource | null)>(sentence: string): T;
}

export default Parser;
