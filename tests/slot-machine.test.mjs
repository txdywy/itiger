import assert from 'node:assert/strict';
import { SlotMachine } from '../js/SlotMachine.js';

function createMachine() {
  return new SlotMachine({
    currentTheme: 'las-vegas',
  });
}

function rigReels(machine, grid) {
  machine._getReelResult = reelIdx => [...grid[reelIdx]];
}

function runSpin(machine) {
  const result = machine.spin();
  assert.ok(result, 'spin should start');
  return machine.checkWins(result.symbols);
}

{
  const machine = createMachine();
  rigReels(machine, [
    [7, 1, 2],
    [7, 2, 3],
    [7, 3, 4],
    [1, 4, 5],
    [2, 5, 1],
  ]);

  const win = runSpin(machine);

  assert.equal(win.scatterCount, 3);
  assert.equal(win.freeSpinsTriggered, true);
  assert.equal(machine.freeSpinsRemaining, 15);
  assert.equal(machine.freeSpinsMultiplier, 3);
  assert.equal(win.totalWin, 10000);
  assert.equal(machine.balance, 18000);
}

{
  const machine = createMachine();
  machine.freeSpinsRemaining = 15;
  machine.freeSpinsMultiplier = 3;
  rigReels(machine, [
    [1, 0, 2],
    [2, 0, 3],
    [3, 0, 4],
    [4, 0, 5],
    [5, 0, 1],
  ]);

  const win = runSpin(machine);

  assert.equal(win.totalWin, 15000);
  assert.equal(machine.balance, 25000);
  assert.equal(machine.freeSpinsRemaining, 14);
  assert.equal(machine.freeSpinsMultiplier, 3);
}

{
  const machine = createMachine();
  rigReels(machine, [
    [1, 0, 2],
    [2, 1, 3],
    [3, 2, 4],
    [4, 3, 5],
    [5, 4, 1],
  ]);

  const win = runSpin(machine);

  assert.equal(win.totalWin, 0);
  assert.equal(machine.balance, 8000);
  assert.equal(machine.freeSpinsRemaining, 0);
}

console.log('slot-machine logic tests passed');
