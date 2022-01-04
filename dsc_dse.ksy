meta:
  id: dsc_dse
seq:
  - id: start_sentence
    type: str
    size: 1
    encoding: UTF-8 
  - id: talker_id
    type: str
    size: 2
    encoding: UTF-8 
  - id: sentence_id
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: format_specifier
    doc: |
      Format Specifier (without first digit)
      102 = selective call to a group of ships in particular geographic area
      112 = distress alert call
      114 = selective call to a group of ships having common interest
      116 = all ships call
      120 = selective call to particular individual station
      123 = selective call to a particular individual using automatic service
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: sender_mssi
    type: str
    terminator: 44 # ,
    encoding: UTF-8
  - id: category_specifier
    doc: |
       Category Element (without first digit)
       100 = Routine
       108 = Safety
       110 = Urgency
       112 = Distress
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: category_field_1
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: category_field_2
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: sender_position
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: time_utc
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: vessel_mmsi
    doc: |
      Vessel MMSI in a relayed distress
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: unknown_1
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: unknown_2
    type: str
    terminator: 44 # ,
    encoding: UTF-8 
  - id: expansion_follows
    type: str
    terminator: 42 # ,
    encoding: UTF-8
  - id: checksum
    type: str
    size: 2
    encoding: UTF-8
  - id: continuation
    type:
      switch-on: expansion_follows
      cases:
        '"E"': expansion
types:
  expansion:
    seq:
      - id: start_sentence
        type: str
        size: 1
        encoding: UTF-8 
      - id: talker_id
        type: str
        size: 2
        encoding: UTF-8 
      - id: sentence_id
        type: str
        terminator: 44 # ,
        encoding: UTF-8 
      - id: message_id
        type: str
        terminator: 44
        encoding: UTF-8
      - id: message_count
        type: str
        terminator: 44
        encoding: UTF-8
      - id: unknown
        type: str
        terminator: 44
        encoding: UTF-8
      - id: sender_mmsi
        type: str
        terminator: 44
        encoding: UTF-8
      - id: expansion_data_specifier
        type: str
        terminator: 44
        encoding: UTF-8
      - id: payload
        type: str
        terminator: 42
        encoding: UTF-8
      - id: checksum
        type: str
        size: 2
        encoding: UTF-8

