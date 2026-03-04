import { expect } from 'chai'
import {dummy} from '../src/index'

describe('dummy', () => {

  it('exists', () => {
    expect(dummy()).to.equal("dummy")
  })
})
