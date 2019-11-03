"""
General utils for the entire project.
DO NOT import any project-related files here. NO Model, NO form, NO nothing.
model_utils is there you can import those
"""
import os
import base64
import contextlib
import re
import wave
from itertools import product

import numpy as np

from root.utils import data_path


def array_to_base64(array):
    return '{}{}::{}'.format(array.dtype, np.shape(array), base64.b64encode(array).decode("ascii"))


def base64_to_array(string):
    a = string.index('(')
    b = string.index(')')

    dtype = string[:a]
    shape = list(map(int, re.sub(r',?\)', '', string[a + 1:b + 1]).split(', ')))
    encoded = string[b + 3:]

    array = np.frombuffer(base64.decodebytes(encoded.encode()), dtype=np.dtype(dtype)).reshape(shape)
    return array


def triu2mat(triu):
    if np.size(np.shape(triu)) > 1:
        raise Exception('dist must be array')

    n = int(np.math.ceil(np.math.sqrt(np.size(triu) * 2)))
    if np.size(triu) != n * (n - 1) / 2:
        raise Exception('dist must have n*(n-1)/2 elements')

    retval = np.zeros((n, n), dtype=triu.dtype)
    retval[np.triu_indices(n, 1)] = triu

    return retval + retval.T


def mat2triu(mat):
    if np.size(np.shape(mat)) == 1:
        raise Exception('Argument must be a square matrix')

    n, m = np.shape(mat)
    if n != m:
        raise Exception('Argument must be a square matrix')

    m1 = np.full((n, m), True, dtype=np.bool)
    m1 = np.triu(m1, 1)
    arr = mat[m1]
    return arr


@contextlib.contextmanager
def printoptions(*args, **kwargs):
    original = np.get_printoptions()
    np.set_printoptions(*args, **kwargs)
    try:
        yield
    finally:
        np.set_printoptions(**original)