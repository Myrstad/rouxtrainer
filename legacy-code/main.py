import math as m

class Sticker:
  def __init__(self, color: str = "x", position: list[float|int] = [0, 0, 0], orientation: str = "x") -> None:
    self.color: str = color
    self.position: list = position
    self.vertexes: list[list] = self.create_vertexes(orientation)
  
  def create_vertexes(self, orientation: str) -> list[list[float|int]]:
    x, y, z = self.position
    if orientation.lower() == 'x':
      return [[x, y + b, z + c] for b in (1, -1) for c in (1, -1)]
    if orientation.lower() == 'y':
      return [[x + a, y, z + c] for a in (1, -1) for c in (1, -1)]
    if orientation.lower() == 'z':
      return [[x + a, y + b, z] for a in (1, -1) for b in (1, -1)]

    raise ValueError("Orientation must be either 'x', 'y' or 'z'")
  
  def _rotate_around_axis(self, point: list[float|int], angle: float, axis: str) -> list[float|int]:
    x, y, z = point
    if axis.lower() == 'x':
      yp = round(y * m.cos(angle) - z * m.sin(angle), 2)
      zp = round(z * m.cos(angle) + y * m.sin(angle), 2)
      return [x, yp, zp]
    if axis.lower() == 'y':
      xp = round(x * m.cos(angle) - z * m.sin(angle), 2)
      zp = round(z * m.cos(angle) + x * m.sin(angle), 2)
      return [xp, y, zp]
    if axis.lower() == 'z':
      xp = round(x * m.cos(angle) - y * m.sin(angle), 2)
      yp = round(y * m.cos(angle) + x * m.sin(angle), 2)
      return [xp, yp, z]
    raise ValueError("not a valid axis (x, y, or z)")
  
  def rotate(self, angle: float, axis: str) -> None:
    """angle in radians, seems to be ccw, axis is either x, y or z."""
    if not axis.lower() in ['x', 'y', 'z']:
      raise ValueError("Not a valid axis (x, y, or z)")

    self.position = self._rotate_around_axis(self.position, angle, axis)
    self.vertexes = [self._rotate_around_axis(p, angle, axis) for p in self.vertexes] 

class Solver:
  def __init__(self, cube) -> None:
    self.cube = cube

class Cube:
  def __init__(self, dimention: int) -> None:
    self.dimention: int = dimention
    self.stickers: list[Sticker] = self.create_cube()

    self.solver = Solver(self)

  def create_face(self, face_position: list[int|float], color: str) -> list[Sticker]:
    dimention = self.dimention
    x, y, z = face_position
    if x != 0:
      return [Sticker(color, [x, b, c], 'x') for b in range(-dimention+1, dimention, 2) for c in range(-dimention+1, dimention, 2)]
    if y != 0:
      return [Sticker(color, [a, y, c], 'y') for a in range(-dimention+1, dimention, 2) for c in range(-dimention+1, dimention, 2)]
    if z != 0:
      return [Sticker(color, [a, b, z], 'z') for a in range(-dimention+1, dimention, 2) for b in range(-dimention+1, dimention, 2)]
    
    raise ValueError("Not a valid position")


  def create_cube(self) -> list[Sticker]:
    dimention = self.dimention
    center_face_positions = [(-dimention,0,0),(dimention,0,0),(0,-dimention,0),(0,dimention,0),(0,0,-dimention),(0,0,dimention)]
    colors = ["green","blue","red","orange","yellow","white"]
    stickers = []

    for color, face_position in zip(colors, center_face_positions):
      face_stickers = self.create_face(face_position, color)
      [stickers.append(sticker) for sticker in face_stickers]
    
    return stickers
  
  def get_sticker_from(self, position: list[float|int]) -> Sticker:
    for sticker in self.stickers:
      if sticker.position == position:
        return sticker
    return None

  def get_sticker_3x3(self, first: str, second: str = None, third: str = None):
    dimention = self.dimention
    x, y, z = 0, 0, 0
    match first.lower():
      case "b":
        x = dimention
      case "f":
        x = -dimention
      case "l":
        y = dimention
      case "r":
        y = -dimention
      case "u":
        z = dimention
      case "d":
        z = -dimention

    if not second:
      return self.get_sticker_from([x,y,z])
    
    match second.lower():
      case "b":
        x = dimention - 1
      case "f":
        x = -dimention + 1
      case "l":
        y = dimention - 1
      case "r":
        y = -dimention + 1
      case "u":
        z = dimention - 1
      case "d":
        z = -dimention + 1

    if not third:
      return self.get_sticker_from([x,y,z])
    
    match third.lower():
      case "b":
        x = dimention - 1
      case "f":
        x = -dimention + 1
      case "l":
        y = dimention - 1
      case "r":
        y = -dimention + 1
      case "u":
        z = dimention - 1
      case "d":
        z = -dimention + 1
    
    return self.get_sticker_from([x,y,z])

  def get_side_stickers(self, side: str) -> list[Sticker]:
    dimention = self.dimention
    stickers: list[Sticker] = []
    threshold = dimention - 1
    print(threshold)

    if side.lower() == "b":
      [stickers.append(s) for s in self.stickers if s.position[0] >= threshold]
    if side.lower() == "f":
      [stickers.append(s) for s in self.stickers if s.position[0] <= -threshold]
    if side.lower() == "l":
      [stickers.append(s) for s in self.stickers if s.position[1] >= threshold]
    if side.lower() == "r":
      [stickers.append(s) for s in self.stickers if s.position[1] <= -threshold]
    if side.lower() == "u":
      [stickers.append(s) for s in self.stickers if s.position[2] >= threshold]
    if side.lower() == "d":
      [stickers.append(s) for s in self.stickers if s.position[2] <= -threshold]
    
    print(f"Face {side} has {len(stickers)} stickers")
    return stickers

  def get_slice_stickers(self, slice) -> list[Sticker]:
    """Gets slice stickers

    More or less all stickers except, eg. L/R for M

    Valid slices:
      * M, follows l
      * E, follows d
      * S, follows f
    """
    dimention = self.dimention
    stickers: list[Sticker] = []
    threshold = dimention - 1

    if slice.lower() == 'm':
      stickers = [s for s in self.stickers if abs(s.position[1]) < threshold]
    if slice.lower() == 'e':
      stickers = [s for s in self.stickers if abs(s.position[0]) < threshold]
    if slice.lower() == 's':
      stickers = [s for s in self.stickers if abs(s.position[2]) < threshold]
    return stickers
    

  def turn(self, move:str) -> None:
    """Turns the cube using one of the legal moves in the list.
    
    Moves:
      * L, R, U, D, F, B  | Normal side moves
      * M, E, S           | Slice moves

    Modifiers for all moves:
      * "2" and "'" | double and counter-clockwise ("prime") moves

    Soon.tm:
      * wide moves (lower case normal ones)
      * cube rotations (x,y,z + modifier), also does not follow right hand rule!
    """
    axis = None
    stickers = None
    if move[0] in ["B", "F", "L", "R", "U", "D"]:
      stickers = self.get_side_stickers(move[0])
    if move[0] in ["M", "E", "S"]:
      stickers = self.get_slice_stickers(move[0])
    if move[0] == "B":
      axis = "x"
      angle = -m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0] == "F":
      axis = "x"
      angle = m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0] == "L":
      axis = "y"
      angle = m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0] == "R":
      axis = "y"
      angle = -m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0] == "U":
      axis = "z"
      angle = -m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0] == "D":
      axis = "z"
      angle = m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    
    if move[0].lower() in ["x","y","z"]:
      stickers = self.stickers
    if move[0].lower() == "x":
      axis = "y"
      angle = -m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0].lower() == "y":
      axis = "z"
      angle = -m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1
    if move[0].lower() == "z":
      axis = "x"
      angle = m.pi/2
      if move[-1] == "2": angle *= 2
      if move[-1] == "'": angle *= -1

    for sticker in stickers:
      sticker.rotate(angle, axis)



if __name__ == "__main__":
  s = Sticker("r", (2,2,0))
  print(s._rotate_around_axis(s.position, m.pi/2, 'z'))
  c = Cube(3)
  # [print(x.__dict__) for x in c.create_face((0,0,3), "white")]
  print([s.position for s in c.stickers])
  print([(s.position, s.color) for s in c.get_slice_stickers("m")], sep="\n", end="\n\n")
  print([(s.position, s.color) for s in c.get_slice_stickers("e")], sep="\n", end="\n\n")
  print([(s.position, s.color) for s in c.get_slice_stickers("s")], sep="\n", end="\n\n")
  # print(c.stickers)
  # print(c.get_sticker_3x3("u").position, c.get_sticker_3x3("u").color)
  # print(c.get_sticker_3x3("u", "f").position)
  # print(c.get_sticker_3x3("u", "f", 'l').position)
  # print("------------------------------")
  # print(c.get_sticker_3x3("d").position, c.get_sticker_3x3("d").color)
  # print(c.get_sticker_3x3("l").position, c.get_sticker_3x3("l").color)
  # print(c.get_sticker_3x3("r").position, c.get_sticker_3x3("r").color)
  # print(c.get_sticker_3x3("f").position, c.get_sticker_3x3("f").color)
  # print(c.get_sticker_3x3("b").position, c.get_sticker_3x3("b").color)
  # print("-------------")
  # c = Cube(1)
  # c.create_cube()
  # print("-------------")
  # c = Cube(2)
  # c.create_cube()
  # print("-------------")
  # c = Cube(4)
  # c.create_cube()