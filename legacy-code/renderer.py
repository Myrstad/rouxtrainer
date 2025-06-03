import math
import pygame as pg
from copy import deepcopy
pg.init()

from main import Cube

class Renderer:
  FPS = 60
  WIDTH = 700
  HEIGHT = 600

  def __init__(self) -> None:
    self.screen = pg.display.set_mode((self.WIDTH, self.HEIGHT))
    self.clock = pg.time.Clock()

    self.cube = Cube(2)
    self.display_cube = deepcopy(self.cube)
    self.camera_rotation = [0, 0, 0]

    self.MOUSE_HELD = False
    self.PMX = None
    self.PMY = None
  
  def render(self, surface: pg.Surface):
    surface.fill("#333333")
    dw = surface.get_width()
    dh = surface.get_height()
    cx = dw / 2
    cy = dh / 2

    self.display_cube = deepcopy(self.cube)
    x, y, z = self.camera_rotation
    [s.rotate(x, "x") for s in self.display_cube.stickers]
    [s.rotate(y, "y") for s in self.display_cube.stickers]
    [s.rotate(z, "z") for s in self.display_cube.stickers]

    self.display_cube.stickers = sorted(self.display_cube.stickers, key=lambda x:x.position[0], reverse=True)
    # print("___________________________________________")
    for sticker in self.display_cube.stickers:
      clr = sticker.color
      vertexes = sticker.vertexes
      # print(sticker.position, clr,  vertexes)
      points = [[cx-x*50,cy-y*50] for _, x, y in vertexes]
      points = [points[0], points[1], points[3], points[2]]
      # print(points)
      pg.draw.polygon(surface, clr, points)
      pg.draw.polygon(surface, "black", points, 4)

    pg.display.flip()

  def main_loop(self):
    running = True
    self.camera_rotation = [-0, 0, -0]
    while running:
      # self.camera_rotation[0] += 0.001
      # self.camera_rotation[1] += 0.002
      # self.camera_rotation[2] += 0.003
      self.clock.tick(self.FPS)
      for event in pg.event.get():
        if event.type == pg.QUIT:
          running = False
        
        if event.type == pg.KEYDOWN:
          if event.key == pg.K_u:
            self.cube.turn("U");

        if event.type == pg.MOUSEBUTTONDOWN:
          self.MOUSE_HELD = True
          self.PMX, self.PMY = pg.mouse.get_pos();
        
        if event.type == pg.MOUSEBUTTONUP:
          self.MOUSE_HELD = False

      if self.MOUSE_HELD:
        dx, dy = (self.PMX - pg.mouse.get_pos()[0], self.PMY - pg.mouse.get_pos()[1])
        self.PMX, self.PMY = pg.mouse.get_pos()
        sensitivity = 0.002
        yaw_delta_input = -dx * sensitivity
        pitch_delta_input = -dy * sensitivity
        current_roll_radians = self.camera_rotation[2]
        self.camera_rotation[0] += yaw_delta_input
        self.camera_rotation[0] += pitch_delta_input * math.sin(current_roll_radians)
        self.camera_rotation[1] += pitch_delta_input * math.cos(current_roll_radians)

        epsilon = 1e-5 # Small value to avoid exact pi/2
        self.camera_rotation[1] = max(-math.pi/2 + epsilon, min(math.pi/2 - epsilon, self.camera_rotation[1]))

        print(dx, dy)
        print(self.camera_rotation)
        self.camera_rotation[0] -= dx/100;
        self.camera_rotation[1] -= dy/100
      self.render(self.screen)

    pg.quit()
    exit(0)

if __name__ == "__main__":
  r = Renderer()
  r.cube.turn("B")
  r.render(r.screen)
  r.main_loop()